package de.uni_potsdam.hpi.bpt.qbe.index;

import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.StringTokenizer;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.analysis.tokenattributes.CharTermAttribute;
import org.apache.lucene.analysis.tokenattributes.TermAttribute;
import org.apache.lucene.util.Version;
import org.jbpt.alignment.NodeAlignment;
import org.jbpt.bp.KSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;

public class RelationAnalyzer {

	protected final static String WHITESPACE = " ";
	protected final static String WORD_SEPARATOR = "_";
	protected final static String RELATION_SYMBOL = ">>>>>>";
	
	
	/**
	 * Extract a set of tokens from this relation, separated by whitespaces.
	 * This allows to use lucene's WhiteSpaceanalyzer for indexing.
	 * 
	 * @param rel
	 * @return
	 */
	public static String extractTokens(KSuccessorRelation<NetSystem, Node> rel) {
		
		String tokens = "";
		for (Node[] pair : rel.getSuccessorPairs()) {
			
			String l1 = pair[0].getLabel();
			String l2 = pair[1].getLabel();
			
			if (NodeAlignment.isValidLabel(l1) && NodeAlignment.isValidLabel(l2)) {
				tokens += join(processLabel(l1),WORD_SEPARATOR) + 
						  RELATION_SYMBOL + 
						  join(processLabel(l2),WORD_SEPARATOR) + 
						  WHITESPACE;
			}
		}
		
		// no relations have been found (because the query contained only single activities)
		//if (tokens.isEmpty()) {
			for (Node n : rel.getEntities()) {
				String l = n.getLabel();
				if (NodeAlignment.isValidLabel(l)) {
					tokens += join(processLabel(l), WORD_SEPARATOR) + WHITESPACE;
				}
			}
		//}
		
		return tokens;
	}

	public static List<String> parseKeywords(String keywords) {
		List<String> terms = new ArrayList<String>();
		StringTokenizer st = new StringTokenizer(keywords, " _");
		while (st.hasMoreTokens()) {
			terms.add(st.nextToken());
		}
		return terms;
	}
	
	/**
	 * Uses Lucene's analyzer to extract terms from tokens
	 * 
	 * @param analyzer
	 * @param keywords
	 * @return
	 */
	public static List<String> parseKeywords(Analyzer analyzer, String keywords) {
		List<String> result = new ArrayList<String>();
		try {
			TokenStream stream = analyzer.tokenStream(null, new StringReader(
					keywords));
			while (stream.incrementToken()) {
				result.add(stream.getAttribute(CharTermAttribute.class)
						.toString());
			}
		} catch (IOException e) {
			// not thrown b/c we're using a string reader...
			throw new RuntimeException(e);
		}
		return result;
	}
	
	public static List<String> processLabel(String label) {
	
		//Analyzer analyzer = new StandardAnalyzer(Version.LUCENE_36);
		List<String> keywords = new ArrayList<String>();
		
		for (String word : parseKeywords(label)) {
			word = removeApostrophe(word);
			word.toLowerCase();
			word = stem(word);
			keywords.add(word);
		}
		
		return keywords;
	}
	
	protected static String stem(String word) {
		Stemmer stemmer = new Stemmer();
		stemmer.add(word.toCharArray(), word.length());
		stemmer.stem();
		return stemmer.toString();
	}
	
	protected static String removeApostrophe(String word) {
		return word.replaceAll("'s", "");
	}
	
	/**
	 * Simple String join function, that concatenates strings without separator
	 * @param collection
	 * @return
	 */
	public static String join(Collection<String> collection) {
		return join(collection, "");
	}

	/**
	 * Simple String join function.
	 * 
	 * @param collection
	 * @param join
	 * @return
	 */
	public static String join(Collection<String> collection, String join) {
		String r = "";
		boolean first = true;
		
		for (String e : collection) {
			if (first) {
				first = false;
				r = e;
			} else {
				r += join + e;
			}
		}
		
		return r;
	}
	
	public static void main(String[] args) {
		System.out.println(join(processLabel("Processing the Order of Handling's Documents"), " "));
	}
}
